package com.kindial.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class TraitTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Trait getTraitSample1() {
        return new Trait().id(1L).traitName("traitName1");
    }

    public static Trait getTraitSample2() {
        return new Trait().id(2L).traitName("traitName2");
    }

    public static Trait getTraitRandomSampleGenerator() {
        return new Trait().id(longCount.incrementAndGet()).traitName(UUID.randomUUID().toString());
    }
}
